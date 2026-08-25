<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveContentRequest;
use App\Http\Resources\ContentResource;
use App\Models\Content;
use App\Support\ContentMedia;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class ContentController extends Controller
{
    public function index(Request $request): View
    {
        $contents = $this->filteredContents($request)
            ->inDisplayOrder()
            ->get();

        return view('dashboard', compact('contents'));
    }

    public function apiIndex(Request $request): JsonResponse
    {
        $perPage = max(1, min($request->integer('per_page', 50), 50));

        $contents = $this->filteredContents($request)
            ->inDisplayOrder()
            ->paginate($perPage)
            ->withQueryString();

        return $this->withoutCache(
            ContentResource::collection($contents)->response(),
        );
    }

    public function show(Request $request, Content $content): JsonResponse
    {
        return $this->withoutCache(
            (new ContentResource($content))->response(),
        );
    }

    public function create(): View
    {
        return view('create');
    }

    public function edit(Content $content): View
    {
        return view('create', compact('content'));
    }

    public function update(SaveContentRequest $request, Content $content): RedirectResponse
    {
        $content->update($request->contentData());

        return redirect()
            ->route('painel')
            ->with('success', 'Conteúdo atualizado com sucesso.');
    }

    public function store(SaveContentRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $contents = Content::query()
                ->inDisplayOrder()
                ->lockForUpdate()
                ->get(['id']);

            foreach ($contents as $index => $content) {
                Content::query()
                    ->whereKey($content->id)
                    ->update(['position' => $index + 2]);
            }

            Content::create([
                ...$request->contentData(),
                'position' => 1,
            ]);
        });

        return redirect()
            ->route('painel')
            ->with('success', 'Conteúdo criado com sucesso e adicionado ao destaque.');
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists(Content::class, 'id'),
            ],
        ]);

        $orderedContents = DB::transaction(function () use ($validated) {
            $contents = Content::query()
                ->inDisplayOrder()
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $requestedIds = collect($validated['order'])->map(fn ($id): int => (int) $id);
            $remainingIds = $contents->keys()->diff($requestedIds);
            $allIds = $requestedIds->concat($remainingIds)->values();

            foreach ($allIds as $index => $id) {
                Content::query()
                    ->whereKey($id)
                    ->update(['position' => $index + 1]);
            }

            return Content::query()->inDisplayOrder()->get();
        });

        return response()->json([
            'message' => 'Ordem dos conteúdos salva.',
            'order' => $orderedContents->pluck('id')->values(),
            'featured_id' => $orderedContents->first()?->id,
        ]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $request->file('image')->store('content-images', 'public');
        $relativeUrl = Storage::disk('public')->url($path);

        // Uploaded files live on this web server. Using the request origin here
        // avoids leaking an APP_URL=http://localhost production configuration.
        $publicPath = parse_url($relativeUrl, PHP_URL_PATH) ?: '/storage/'.$path;

        return response()->json([
            'url' => ContentMedia::absoluteUrl($publicPath, $request),
        ], 201);
    }

    public function destroy(Content $content): RedirectResponse
    {
        DB::transaction(function () use ($content): void {
            $content->delete();

            $remainingContents = Content::query()
                ->inDisplayOrder()
                ->lockForUpdate()
                ->get(['id']);

            foreach ($remainingContents as $index => $remainingContent) {
                Content::query()
                    ->whereKey($remainingContent->id)
                    ->update(['position' => $index + 1]);
            }
        });

        return redirect()
            ->route('painel')
            ->with('success', 'Conteúdo excluído com sucesso.');
    }

    private function filteredContents(Request $request): Builder
    {
        $search = trim((string) $request->query('search', ''));
        $tags = trim((string) $request->query('tags', ''));

        return Content::query()
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('tags', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%");
                });
            })
            ->when($tags !== '', fn (Builder $query) => $query->where('tags', 'like', "%{$tags}%"));
    }

    private function withoutCache(JsonResponse $response): JsonResponse
    {
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, private');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }
}
