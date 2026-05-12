<?php

namespace App\Http\Controllers;

use App\Models\Content;

class ContentController extends Controller
{
    public function index()
    {
        $contents = Content::latest()->get();

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