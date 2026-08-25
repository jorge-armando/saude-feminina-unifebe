<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Content extends Model
{
    protected $fillable = [
        'title',
        'content',
        'tags',
        'reading_time',
        'position',
        'youtube_url',
    ];

    protected function casts(): array
    {
        return [
            'reading_time' => 'integer',
            'position' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Content $content): void {
            if ($content->position === null) {
                $content->position = ((int) static::query()->max('position')) + 1;
            }
        });
    }

    public function scopeInDisplayOrder(Builder $query): Builder
    {
        return $query
            ->orderByRaw('CASE WHEN position IS NULL THEN 1 ELSE 0 END')
            ->orderBy('position')
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }
}
