<?php

namespace Tests\Unit;

use App\Support\ContentMedia;
use Illuminate\Http\Request;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ContentMediaTest extends TestCase
{
    #[DataProvider('youtubeUrls')]
    public function test_youtube_urls_are_normalized(string $input): void
    {
        $this->assertSame(
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            ContentMedia::normalizeYoutubeUrl($input),
        );
    }

    /** @return array<string, array{string}> */
    public static function youtubeUrls(): array
    {
        return [
            'watch' => ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share'],
            'short' => ['https://youtu.be/dQw4w9WgXcQ?t=12'],
            'shorts' => ['https://youtube.com/shorts/dQw4w9WgXcQ'],
            'embed' => ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
        ];
    }

    public function test_non_youtube_and_invalid_video_urls_are_rejected(): void
    {
        $this->assertNull(ContentMedia::normalizeYoutubeUrl('https://example.com/watch?v=dQw4w9WgXcQ'));
        $this->assertNull(ContentMedia::normalizeYoutubeUrl('https://youtube.com/watch?v=short'));
        $this->assertNull(ContentMedia::normalizeYoutubeUrl('javascript:alert(1)'));
    }

    public function test_first_markdown_image_supports_balanced_parentheses(): void
    {
        $request = Request::create('https://api.test/api/contents');
        $body = '![Capa](/storage/filters:no_upscale():max_bytes(150000):strip_icc()/capa.jpg)';

        $this->assertSame(
            'https://api.test/storage/filters:no_upscale():max_bytes(150000):strip_icc()/capa.jpg',
            ContentMedia::firstImageUrl($body, $request),
        );
        $this->assertStringContainsString(
            '](https://api.test/storage/filters:no_upscale():max_bytes(150000):strip_icc()/capa.jpg)',
            ContentMedia::withAbsoluteImageUrls($body, $request),
        );
    }

    public function test_markdown_image_unescapes_parentheses_in_url(): void
    {
        $request = Request::create('https://api.test/api/contents');
        $body = '![Capa](https://cdn.test/foto\\(1\\).jpg)';
        $expected = 'https://cdn.test/foto(1).jpg';

        $this->assertSame($expected, ContentMedia::firstImageUrl($body, $request));
        $this->assertStringContainsString(
            ']('.$expected.')',
            ContentMedia::withAbsoluteImageUrls($body, $request),
        );
    }

    public function test_legacy_localhost_storage_url_uses_current_request_origin(): void
    {
        $request = Request::create('https://api.test/api/contents');
        $body = '![Capa](http://localhost/storage/content-images/capa.jpg)';

        $this->assertSame(
            'https://api.test/storage/content-images/capa.jpg',
            ContentMedia::firstImageUrl($body, $request),
        );
    }
}
