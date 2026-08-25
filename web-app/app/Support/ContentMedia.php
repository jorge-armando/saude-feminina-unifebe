<?php

namespace App\Support;

use Illuminate\Http\Request;

class ContentMedia
{
    public static function absoluteUrl(?string $url, Request $request): ?string
    {
        $url = trim((string) $url);

        if ($url === '') {
            return null;
        }

        if (str_starts_with($url, '//')) {
            return $request->getScheme().':'.$url;
        }

        if (filter_var($url, FILTER_VALIDATE_URL)) {
            $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

            if (in_array($scheme, ['http', 'https'], true)) {
                $host = strtolower((string) parse_url($url, PHP_URL_HOST));
                $requestHost = strtolower($request->getHost());
                $path = (string) parse_url($url, PHP_URL_PATH);
                $query = parse_url($url, PHP_URL_QUERY);

                if (str_starts_with($path, '/storage/') && (
                    in_array($host, ['localhost', '127.0.0.1', '::1'], true)
                    || $host === $requestHost
                )) {
                    return $request->getSchemeAndHttpHost().$path
                        .($query !== null ? '?'.$query : '');
                }
            }

            return in_array($scheme, ['http', 'https'], true) ? $url : null;
        }

        if (preg_match('/^[a-z][a-z0-9+.-]*:/i', $url) === 1) {
            return null;
        }

        $path = '/'.ltrim($url, '/');

        return $request->getSchemeAndHttpHost().$path;
    }

    public static function firstImageUrl(string $body, Request $request): ?string
    {
        $markdownImage = self::markdownImageReferences($body)[0] ?? null;
        $htmlImage = null;

        if (preg_match(
            '/<img\b[^>]*\bsrc\s*=\s*(["\'])(.*?)\1[^>]*>/i',
            $body,
            $matches,
            PREG_OFFSET_CAPTURE,
        ) === 1) {
            $htmlImage = [
                'offset' => $matches[0][1],
                'url' => $matches[2][0],
            ];
        }

        $firstImage = match (true) {
            $markdownImage === null => $htmlImage,
            $htmlImage === null => $markdownImage,
            $markdownImage['offset'] < $htmlImage['offset'] => $markdownImage,
            default => $htmlImage,
        };

        return self::absoluteUrl(
            isset($firstImage['url'])
                ? self::decodeMarkdownDestination($firstImage['url'])
                : null,
            $request,
        );
    }

    public static function withAbsoluteImageUrls(string $body, Request $request): string
    {
        $references = array_reverse(self::markdownImageReferences($body));

        foreach ($references as $reference) {
            $absoluteUrl = self::absoluteUrl(
                self::decodeMarkdownDestination($reference['url']),
                $request,
            );

            if ($absoluteUrl !== null) {
                $body = substr_replace(
                    $body,
                    $absoluteUrl,
                    $reference['url_offset'],
                    $reference['url_length'],
                );
            }
        }

        return preg_replace_callback(
            '/(<img\b[^>]*\bsrc\s*=\s*["\'])(.*?)(["\'][^>]*>)/i',
            fn (array $matches): string => $matches[1]
                .(self::absoluteUrl(html_entity_decode($matches[2]), $request) ?? $matches[2])
                .$matches[3],
            $body,
        ) ?? $body;
    }

    public static function normalizeYoutubeUrl(?string $url): ?string
    {
        $url = trim((string) $url);

        if ($url === '' || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        $host = strtolower(rtrim($parts['host'] ?? '', '.'));
        $path = trim($parts['path'] ?? '', '/');

        if (! in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        $videoId = null;

        if (in_array($host, ['youtu.be', 'www.youtu.be'], true)) {
            $videoId = explode('/', $path)[0] ?? null;
        } elseif (in_array($host, [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'music.youtube.com',
            'youtube-nocookie.com',
            'www.youtube-nocookie.com',
        ], true)) {
            $segments = array_values(array_filter(explode('/', $path)));

            if (($segments[0] ?? null) === 'watch') {
                parse_str($parts['query'] ?? '', $query);
                $videoId = $query['v'] ?? null;
            } elseif (in_array($segments[0] ?? null, ['embed', 'shorts', 'live'], true)) {
                $videoId = $segments[1] ?? null;
            }
        }

        if (! is_string($videoId) || preg_match('/^[A-Za-z0-9_-]{11}$/', $videoId) !== 1) {
            return null;
        }

        return 'https://www.youtube.com/watch?v='.$videoId;
    }

    /**
     * Finds inline Markdown image destinations while respecting balanced
     * parentheses inside URLs (common in image CDN transformation paths).
     *
     * @return list<array{offset: int, url: string, url_offset: int, url_length: int}>
     */
    private static function markdownImageReferences(string $body): array
    {
        $references = [];
        $offset = 0;
        $length = strlen($body);

        while (($imageOffset = strpos($body, '![', $offset)) !== false) {
            $labelEnd = self::findUnescaped($body, '](', $imageOffset + 2);

            if ($labelEnd === null) {
                break;
            }

            $cursor = $labelEnd + 2;

            while ($cursor < $length && ctype_space($body[$cursor])) {
                $cursor++;
            }

            $wrappedInAngles = ($body[$cursor] ?? null) === '<';
            if ($wrappedInAngles) {
                $cursor++;
            }

            $urlOffset = $cursor;
            $parenthesisDepth = 0;

            while ($cursor < $length) {
                $character = $body[$cursor];

                if ($character === '\\') {
                    $cursor += 2;
                    continue;
                }

                if ($wrappedInAngles && $character === '>') {
                    break;
                }

                if (! $wrappedInAngles && ctype_space($character) && $parenthesisDepth === 0) {
                    break;
                }

                if ($character === '(') {
                    $parenthesisDepth++;
                } elseif ($character === ')') {
                    if ($parenthesisDepth === 0) {
                        break;
                    }

                    $parenthesisDepth--;
                }

                $cursor++;
            }

            $urlLength = $cursor - $urlOffset;

            if ($urlLength > 0) {
                $references[] = [
                    'offset' => $imageOffset,
                    'url' => substr($body, $urlOffset, $urlLength),
                    'url_offset' => $urlOffset,
                    'url_length' => $urlLength,
                ];
            }

            $offset = max($cursor + 1, $imageOffset + 2);
        }

        return $references;
    }

    private static function findUnescaped(string $body, string $needle, int $offset): ?int
    {
        while (($position = strpos($body, $needle, $offset)) !== false) {
            $backslashes = 0;

            for ($cursor = $position - 1; $cursor >= 0 && $body[$cursor] === '\\'; $cursor--) {
                $backslashes++;
            }

            if ($backslashes % 2 === 0) {
                return $position;
            }

            $offset = $position + strlen($needle);
        }

        return null;
    }

    private static function decodeMarkdownDestination(string $url): string
    {
        return str_replace(
            ['\\(', '\\)'],
            ['(', ')'],
            html_entity_decode($url),
        );
    }
}
