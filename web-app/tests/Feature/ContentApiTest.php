<?php

namespace Tests\Feature;

use App\Models\Content;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_contents_are_fresh_ordered_and_include_media_contract(): void
    {
        Content::create([
            'title' => 'Segundo artigo',
            'content' => 'Texto sem imagem.',
            'tags' => null,
            'reading_time' => 3,
            'position' => 2,
        ]);

        $featured = Content::create([
            'title' => 'Artigo em destaque',
            'content' => '![Capa](/storage/content-images/filters:no_upscale():max_bytes(150000):strip_icc()/capa.jpg)'."\n\nTexto do artigo.",
            'tags' => 'saúde, teste',
            'reading_time' => 4,
            'position' => 1,
            'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ]);

        $response = $this->getJson('https://conteudos.test/api/contents');

        $absoluteImage = 'https://conteudos.test/storage/content-images/filters:no_upscale():max_bytes(150000):strip_icc()/capa.jpg';

        $response
            ->assertOk()
            ->assertHeader('Cache-Control')
            ->assertJsonPath('meta.per_page', 50)
            ->assertJsonPath('data.0.id', $featured->id)
            ->assertJsonPath('data.0.position', 1)
            ->assertJsonPath('data.0.is_featured', true)
            ->assertJsonPath('data.0.image_url', $absoluteImage)
            ->assertJsonPath('data.0.youtube_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
            ->assertJsonPath('data.1.tags', '');

        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));

        $this->assertStringContainsString(
            '!['.'Capa'.']('.$absoluteImage.')',
            $response->json('data.0.content'),
        );
    }

    public function test_default_page_contains_fifty_items_in_persisted_order(): void
    {
        foreach (range(1, 55) as $position) {
            Content::create([
                'title' => "Conteúdo {$position}",
                'content' => 'Corpo',
                'reading_time' => 1,
                'position' => $position,
            ]);
        }

        $response = $this->getJson('/api/contents');

        $response
            ->assertOk()
            ->assertJsonCount(50, 'data')
            ->assertJsonPath('meta.total', 55)
            ->assertJsonPath('meta.per_page', 50)
            ->assertJsonPath('data.0.position', 1)
            ->assertJsonPath('data.49.position', 50);
    }

    public function test_search_and_tag_filters_are_grouped_together(): void
    {
        Content::create([
            'title' => 'Ciclo menstrual',
            'content' => 'Corpo',
            'tags' => 'ciclo',
            'reading_time' => 2,
            'position' => 1,
        ]);
        $matching = Content::create([
            'title' => 'Ciclo e bem-estar',
            'content' => 'Corpo',
            'tags' => 'bem-estar',
            'reading_time' => 2,
            'position' => 2,
        ]);

        $this->getJson('/api/contents?search=Ciclo&tags=bem-estar')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matching->id);
    }

    public function test_single_content_response_is_not_cached(): void
    {
        $content = Content::create([
            'title' => 'Artigo individual',
            'content' => 'Corpo',
            'reading_time' => 2,
            'position' => 1,
        ]);

        $response = $this->getJson("/api/contents/{$content->id}")
            ->assertOk()
            ->assertHeader('Cache-Control')
            ->assertJsonPath('data.is_featured', true);

        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }
}
