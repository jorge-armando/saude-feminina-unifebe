@extends('layouts.app')

@section('title', 'Dashboard Admin')

@section('content')

    <div class="dashboard-page">

        <div class="dashboard-header">
            <div>
                <h1>Dashboard Admin</h1>
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
                <div class="search-box">
                    <input type="text" placeholder="Buscar conteúdos...">
                </div>

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

                        <tr>
                            <td>Entendendo o Ciclo Menstrual</td>

                            <td>
                                <span class="tag">ciclo</span>
                                <span class="tag">saúde</span>
                            </td>

                            <td>5 min</td>

                            <td>14/03/2024</td>

                            <td class="actions">

                                <button class="edit">
                                    <img src="{{ asset('images/editar.png') }}" alt="Editar">
                                </button>

                                <button class="delete">
                                    <img src="{{ asset('images/lixeira.png') }}" alt="Excluir">
                                </button>
                            </td>
                        </tr>
                </div>
            </div>
        </div>
    </div>
@endsection