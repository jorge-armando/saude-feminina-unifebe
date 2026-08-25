<?php

namespace App\Http\Resources;

use App\Support\ContentMedia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $body = (string) $this->content;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => ContentMedia::withAbsoluteImageUrls($body, $request),
            'tags' => (string) ($this->tags ?? ''),
            'reading_time' => (int) $this->reading_time,
            'position' => (int) $this->position,
            'is_featured' => (int) $this->position === 1,
            'image_url' => ContentMedia::firstImageUrl($body, $request),
            'youtube_url' => $this->youtube_url,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
