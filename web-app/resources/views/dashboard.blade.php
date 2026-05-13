@extends('layouts.app')

@section('title', 'Painel Admin')

@section('content')

    <div class="dashboard-page">

        <div class="dashboard-header">

            <div>
                <h1>Painel Admin</h1>
                <p>Minha Saúde Feminina</p>
            </div>

            <form method="POST" action="{{ route('sair') }}">
                @csrf

                <button type="submit" class="btn-logout">
                    Sair
                </button>
            </form>

        </div>

        <div class="dashboard-content">

            <div class="dashboard-actions">

                <form method="GET" action="{{ route('painel') }}" class="search-form">
                    <div class="search-box">
                        <input type="text" name="search" placeholder="Buscar conteúdos..." value="{{ request('search') }}">
                    </div>

                    <button type="submit" class="btn-search">
                        Buscar
                    </button>
                </form>

                <a href="{{ url('/novo-conteudo') }}" class="btn-new">
                    + Novo Conteúdo
                </a>

            </div>

            <div class="content-card">

                <table class="desktop-table">

                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Tags</th>
                            <th>Tempo de Leitura</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>

                        @forelse ($contents as $content)

                            <tr>

                                <td>
                                    {{ $content->title }}
                                </td>

                                <td>

                                    @foreach (explode(',', $content->tags) as $tag)

                                        <span class="tag">
                                            {{ trim($tag) }}
                                        </span>

                                    @endforeach

                                </td>

                                <td>
                                    {{ $content->reading_time }} min
                                </td>

                                <td>
                                    {{ $content->created_at->format('d/m/Y') }}
                                </td>

                                <td class="actions">

                                    <a href="{{ route('contents.edit', $content) }}" class="edit">
                                        <img src="{{ asset('images/editar.png') }}" alt="Editar">
                                    </a>

                                    <form action="{{ route('contents.destroy', $content->id) }}" method="POST"
                                        onsubmit="return confirm('Deseja excluir este conteúdo?')">

                                        @csrf
                                        @method('DELETE')

                                        <button type="submit" class="delete">

                                            <img src="{{ asset('images/lixeira.png') }}" alt="Excluir">

                                        </button>

                                    </form>

                                </td>

                            </tr>

                        @empty

                            <tr>

                                <td colspan="5" style="text-align: center;">
                                    Nenhum conteúdo encontrado.
                                </td>

                            </tr>

                        @endforelse

                    </tbody>

                </table>

                <div class="mobile-list">

                    @forelse ($contents as $content)

                        <div class="mobile-card">

                            <div class="mobile-card-header">

                                <h3>
                                    {{ $content->title }}
                                </h3>

                                <div class="actions">

                                    <a href="{{ route('contents.edit', $content) }}" class="edit">
                                        <img src="{{ asset('images/editar.png') }}" alt="Editar">
                                    </a>

                                    <form action="{{ route('contents.destroy', $content->id) }}" method="POST"
                                        onsubmit="return confirm('Deseja excluir este conteúdo?')">

                                        @csrf
                                        @method('DELETE')

                                        <button type="submit" class="delete">

                                            <img src="{{ asset('images/lixeira.png') }}" alt="Excluir">

                                        </button>

                                    </form>

                                </div>

                            </div>

                            <div class="mobile-tags">

                                @foreach (explode(',', $content->tags) as $tag)

                                    <span class="tag">
                                        {{ trim($tag) }}
                                    </span>

                                @endforeach

                            </div>

                            <div class="mobile-info">

                                <span>
                                    {{ $content->reading_time }} min
                                </span>

                                <span>
                                    {{ $content->created_at->format('d/m/Y') }}
                                </span>

                            </div>

                        </div>

                    @empty

                        <div class="mobile-card">

                            <h3>
                                Nenhum conteúdo encontrado.
                            </h3>

                        </div>

                    @endforelse

                </div>

            </div>

        </div>

    </div>

@endsection