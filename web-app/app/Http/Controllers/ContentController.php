<?php

namespace App\Http\Controllers;

use App\Models\Content;

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

    public function destroy(Content $content)
    {
        $content->delete();

        return redirect()
            ->route('painel')
            ->with('success', 'Conteúdo excluído com sucesso.');
    }
}