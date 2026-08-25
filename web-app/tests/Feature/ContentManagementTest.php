<?php

namespace Tests\Feature;

use App\Models\Content;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ContentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_content_is_persisted_as_the_featured_item(): void
    {
        $oldFeatured = $this->content('Destaque anterior', 1);
        $second = $this->content('Segundo artigo', 2);

        $this->actingAs(User::factory()->create())
            ->post('/conteudos', [
                'title' => 'Teste novo',
                'content' => '555',
                'tags' => 'teste',
                'reading_time' => 1,
                'youtube_url' => 'https://youtu.be/dQw4w9WgXcQ?t=10',
            ])
            ->assertRedirect(route('painel'));

        $created = Content::query()->where('title', 'Teste novo')->firstOrFail();

        $this->assertSame(1, $created->position);
        $this->assertSame('https://www.youtube.com/watch?v=dQw4w9WgXcQ', $created->youtube_url);
        $this->assertSame(2, $oldFeatured->fresh()->position);
        $this->assertSame(3, $second->fresh()->position);

        $this->getJson('/api/contents')
            ->assertJsonPath('data.0.id', $created->id)
            ->assertJsonPath('data.0.is_featured', true);
    }

    public function test_admin_can_reorder_contents_and_the_first_becomes_featured(): void
    {
        $first = $this->content('Primeiro', 1);
        $second = $this->content('Segundo', 2);
        $third = $this->content('Terceiro', 3);

        $this->actingAs(User::factory()->create())
            ->patchJson('/conteudos/reordenar', [
                'order' => [$third->id, $first->id, $second->id],
            ])
            ->assertOk()
            ->assertJsonPath('order.0', $third->id)
            ->assertJsonPath('featured_id', $third->id);

        $this->assertSame(1, $third->fresh()->position);
        $this->assertSame(2, $first->fresh()->position);
        $this->assertSame(3, $second->fresh()->position);

        $this->getJson('/api/contents')
            ->assertJsonPath('data.0.id', $third->id)
            ->assertJsonPath('data.0.is_featured', true)
            ->assertJsonPath('data.1.is_featured', false);
    }

    public function test_reordering_requires_authentication(): void
    {
        $content = $this->content('Conteúdo', 1);

        $this->patchJson('/conteudos/reordenar', ['order' => [$content->id]])
            ->assertUnauthorized();
    }

    public function test_invalid_youtube_link_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->from('/novo-conteudo')
            ->post('/conteudos', [
                'title' => 'Artigo com vídeo',
                'content' => 'Corpo',
                'reading_time' => 1,
                'youtube_url' => 'https://example.com/watch?v=dQw4w9WgXcQ',
            ])
            ->assertRedirect('/novo-conteudo')
            ->assertSessionHasErrors('youtube_url');

        $this->assertDatabaseCount('contents', 0);
    }

    public function test_image_upload_returns_a_public_absolute_url_from_request_origin(): void
    {
        Storage::fake('public');

        $onePixelPng = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
            true,
        );

        $response = $this
            ->actingAs(User::factory()->create())
            ->withHeader('Accept', 'application/json')
            ->post('https://admin.test/conteudos/upload-imagem', [
                'image' => UploadedFile::fake()->createWithContent('capa.png', $onePixelPng),
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('url', fn (string $url): bool => str_starts_with(
                $url,
                'https://admin.test/storage/content-images/',
            ));

        $storedPath = str_replace('https://admin.test/storage/', '', $response->json('url'));
        Storage::disk('public')->assertExists($storedPath);
    }

    private function content(string $title, int $position): Content
    {
        return Content::create([
            'title' => $title,
            'content' => 'Corpo do artigo',
            'tags' => 'saúde',
            'reading_time' => 2,
            'position' => $position,
        ]);
    }
}
