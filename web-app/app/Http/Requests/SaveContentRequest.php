<?php

namespace App\Http\Requests;

use App\Support\ContentMedia;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class SaveContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'tags' => ['nullable', 'string', 'max:255'],
            'reading_time' => ['required', 'integer', 'min:1'],
            'youtube_url' => [
                'nullable',
                'string',
                'max:2048',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (ContentMedia::normalizeYoutubeUrl(is_string($value) ? $value : null) === null) {
                        $fail('Informe um link válido de vídeo do YouTube.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function contentData(): array
    {
        $data = $this->validated();
        $data['tags'] = trim((string) ($data['tags'] ?? '')) ?: null;
        $data['youtube_url'] = ContentMedia::normalizeYoutubeUrl($data['youtube_url'] ?? null);

        return $data;
    }
}
