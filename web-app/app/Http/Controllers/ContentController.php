<?php

namespace App\Http\Controllers;

use App\Models\Content;
use App\Http\Resources\ContentResource;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function index()
    {
        $search = request('search');

        $contents = Content::when($search, function ($query, $search) {
            return $query->where('title', 'like', "%{$search}%")
                ->orWhere('tags', 'like', "%{$search}%")
                ->orWhere('content', 'like', "%{$search}%");
        })
            ->latest()
            ->get();

        return view('dashboard', compact('contents'));
    }

    public function apiIndex()
    {
        $search = request('search');
        $perPage = min(request('per_page', 15), 50);

        $contents = Content::when($search, function ($query, $search) {
            return $query->where('title', 'like', "%{$search}%")
                ->orWhere('tags', 'like', "%{$search}%")
                ->orWhere('content', 'like', "%{$search}%");
        })
            ->latest()
            ->paginate($perPage);

        return ContentResource::collection($contents);
    }

    public function create()
    {
        return view('create');
    }

    public function edit(Content $content)
{
    return view('create', compact('content'));
}

public function update(Request $request, Content $content)
{
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'content' => 'required|string',
        'tags' => 'nullable|string|max:255',
        'reading_time' => 'required|integer|min:1',
    ]);

    $content->update($validated);

    return redirect()
        ->route('painel')
        ->with('success', 'Conteúdo atualizado com sucesso.');
}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'tags' => 'nullable|string|max:255',
            'reading_time' => 'required|integer|min:1',
        ]);

        Content::create($validated);

        return redirect()
            ->route('painel')
            ->with('success', 'Conteúdo criado com sucesso.');
    }

    public function destroy(Content $content)
    {
        $content->delete();

        return redirect()
            ->route('painel')
            ->with('success', 'Conteúdo excluído com sucesso.');
    }
}