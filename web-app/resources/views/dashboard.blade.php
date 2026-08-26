@extends('layouts.app')

@section('title', 'Painel Admin')

@section('content')
    @php($canReorder = !request()->filled('search'))

    <div class="dashboard-page">
        <div class="dashboard-header">
            <div>
                <h1>Painel Admin</h1>
                <p>Minha Saúde Feminina</p>
            </div>

            <div class="dashboard-header-actions">
                <a href="{{ asset('app/android/saudefeminina.apk') }}" download="SaudeFeminina.apk" class="btn-new">
                    Baixar App
                </a>

                <form method="POST" action="{{ route('sair') }}">
                    @csrf
                    <button type="submit" class="btn-logout">Sair</button>
                </form>
            </div>
        </div>

        <div class="dashboard-content">
            @if (session('success'))
                <div class="alert alert-success" role="status">{{ session('success') }}</div>
            @endif

            <div class="dashboard-actions">
                <form method="GET" action="{{ route('painel') }}" class="search-form">
                    <div class="search-box">
                        <input type="text" name="search" placeholder="Buscar conteúdos..." value="{{ request('search') }}">
                    </div>

                    <button type="submit" class="btn-search">Buscar</button>
                </form>

                <a href="{{ route('conteudos.create') }}" class="btn-new">+ Novo Conteúdo</a>
            </div>

            <div class="ordering-help">
                @if ($canReorder)
                    <span>O primeiro item é exibido como destaque no app. Arraste os itens ou use as setas para mudar a ordem.</span>
                    <span id="ordering-status" class="ordering-status" aria-live="polite"></span>
                @else
                    <span>Limpe a busca para alterar a ordem dos conteúdos.</span>
                    <a href="{{ route('painel') }}">Limpar busca</a>
                @endif
            </div>

            <div class="content-card">
                <table class="desktop-table">
                    <colgroup>
                        <col class="column-order">
                        <col class="column-title">
                        <col class="column-media">
                        <col class="column-tags">
                        <col class="column-reading">
                        <col class="column-date">
                        <col class="column-actions">
                    </colgroup>
                    <thead>
                        <tr>
                            <th aria-label="Ordenar"></th>
                            <th>Título</th>
                            <th>Mídia</th>
                            <th>Tags</th>
                            <th>Leitura</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody class="sortable-content-list" data-reorder-enabled="{{ $canReorder ? 'true' : 'false' }}">
                        @forelse ($contents as $content)
                            @php($imageUrl = \App\Support\ContentMedia::firstImageUrl((string) $content->content, request()))
                            <tr data-content-id="{{ $content->id }}" @if($canReorder) draggable="true" @endif>
                                <td class="ordering-cell">
                                    <span class="drag-handle" title="Arrastar para ordenar" aria-hidden="true">⋮⋮</span>
                                </td>

                                <td>
                                    <div class="content-title-cell">
                                        <span class="featured-badge {{ (int) $content->position === 1 ? '' : 'is-hidden' }}">Em destaque</span>
                                        <span>{{ $content->title }}</span>
                                    </div>
                                </td>

                                <td>
                                    <div class="media-indicators">
                                        @if ($imageUrl)
                                            <img src="{{ $imageUrl }}" alt="" class="content-thumbnail">
                                        @endif
                                        @if ($content->youtube_url)
                                            <span class="youtube-icon" title="YouTube" aria-label="YouTube" role="img"></span>
                                        @endif
                                        @if (!$imageUrl && !$content->youtube_url)
                                            <span class="muted-text">Sem mídia</span>
                                        @endif
                                    </div>
                                </td>

                                <td>
                                    @foreach (array_filter(array_map('trim', explode(',', (string) $content->tags))) as $tag)
                                        <span class="tag">{{ $tag }}</span>
                                    @endforeach
                                </td>

                                <td>{{ $content->reading_time }} min</td>
                                <td>{{ $content->created_at->format('d/m/Y') }}</td>

                                <td>
                                    <div class="actions">
                                        @if ($canReorder)
                                            <button type="button" class="move-content" data-direction="up" title="Mover para cima" aria-label="Mover {{ $content->title }} para cima">↑</button>
                                            <button type="button" class="move-content" data-direction="down" title="Mover para baixo" aria-label="Mover {{ $content->title }} para baixo">↓</button>
                                        @endif

                                        <a href="{{ route('contents.edit', $content) }}" class="edit">
                                            <img src="{{ asset('images/editar.png') }}" alt="Editar">
                                        </a>

                                        <form action="{{ route('contents.destroy', $content) }}" method="POST"
                                            onsubmit="return confirm('Deseja excluir este conteúdo?')">
                                            @csrf
                                            @method('DELETE')

                                            <button type="submit" class="delete">
                                                <img src="{{ asset('images/lixeira.png') }}" alt="Excluir">
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="empty-state">Nenhum conteúdo encontrado.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>

                <div class="mobile-list sortable-content-list" data-reorder-enabled="{{ $canReorder ? 'true' : 'false' }}">
                    @forelse ($contents as $content)
                        @php($imageUrl = \App\Support\ContentMedia::firstImageUrl((string) $content->content, request()))
                        <div class="mobile-card" data-content-id="{{ $content->id }}" @if($canReorder) draggable="true" @endif>
                            <div class="mobile-card-header">
                                <div class="mobile-title-with-handle">
                                    <span class="drag-handle" title="Arrastar para ordenar" aria-hidden="true">⋮⋮</span>
                                    <div>
                                        <span class="featured-badge {{ (int) $content->position === 1 ? '' : 'is-hidden' }}">Em destaque</span>
                                        <h3>{{ $content->title }}</h3>
                                    </div>
                                </div>

                                <div class="actions">
                                    @if ($canReorder)
                                        <button type="button" class="move-content" data-direction="up" aria-label="Mover {{ $content->title }} para cima">↑</button>
                                        <button type="button" class="move-content" data-direction="down" aria-label="Mover {{ $content->title }} para baixo">↓</button>
                                    @endif

                                    <a href="{{ route('contents.edit', $content) }}" class="edit">
                                        <img src="{{ asset('images/editar.png') }}" alt="Editar">
                                    </a>

                                    <form action="{{ route('contents.destroy', $content) }}" method="POST"
                                        onsubmit="return confirm('Deseja excluir este conteúdo?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="delete">
                                            <img src="{{ asset('images/lixeira.png') }}" alt="Excluir">
                                        </button>
                                    </form>
                                </div>
                            </div>

                            @if ($imageUrl)
                                <img src="{{ $imageUrl }}" alt="" class="mobile-content-image">
                            @endif

                            <div class="mobile-tags">
                                @foreach (array_filter(array_map('trim', explode(',', (string) $content->tags))) as $tag)
                                    <span class="tag">{{ $tag }}</span>
                                @endforeach
                                @if ($content->youtube_url)
                                    <span class="youtube-icon" title="YouTube" aria-label="YouTube" role="img"></span>
                                @endif
                            </div>

                            <div class="mobile-info">
                                <span>{{ $content->reading_time }} min</span>
                                <span>{{ $content->created_at->format('d/m/Y') }}</span>
                            </div>
                        </div>
                    @empty
                        <div class="mobile-card"><h3>Nenhum conteúdo encontrado.</h3></div>
                    @endforelse
                </div>
            </div>
        </div>
    </div>

    @if ($canReorder && $contents->isNotEmpty())
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const containers = [...document.querySelectorAll('.sortable-content-list[data-reorder-enabled="true"]')];
                const status = document.querySelector('#ordering-status');
                const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
                let draggedItem = null;
                let originalOrder = [];
                let isSaving = false;

                const items = (container) => [...container.querySelectorAll(':scope > [data-content-id]')];
                const order = (container) => items(container).map((item) => Number(item.dataset.contentId));

                function syncContainers(savedOrder) {
                    containers.forEach((container) => {
                        const byId = new Map(items(container).map((item) => [Number(item.dataset.contentId), item]));
                        savedOrder.forEach((id) => {
                            if (byId.has(id)) container.appendChild(byId.get(id));
                        });

                        items(container).forEach((item, index) => {
                            item.querySelector('.featured-badge')?.classList.toggle('is-hidden', index !== 0);
                        });
                    });
                }

                async function persistOrder(container) {
                    if (isSaving) return;

                    isSaving = true;
                    status.textContent = 'Salvando ordem...';

                    try {
                        const response = await fetch(@json(route('contents.reorder')), {
                            method: 'PATCH',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': csrfToken,
                            },
                            body: JSON.stringify({ order: order(container) }),
                        });
                        const data = await response.json();

                        if (!response.ok || !Array.isArray(data.order)) {
                            throw new Error(data.message || 'Não foi possível salvar a ordem.');
                        }

                        syncContainers(data.order.map(Number));
                        status.textContent = 'Ordem salva. O primeiro item está em destaque.';
                    } catch (error) {
                        syncContainers(originalOrder);
                        status.textContent = error.message || 'Não foi possível salvar a ordem.';
                    } finally {
                        isSaving = false;
                    }
                }

                function itemAfterPointer(container, pointerY) {
                    return items(container)
                        .filter((item) => item !== draggedItem)
                        .reduce((closest, item) => {
                            const box = item.getBoundingClientRect();
                            const offset = pointerY - box.top - box.height / 2;

                            return offset < 0 && offset > closest.offset
                                ? { offset, item }
                                : closest;
                        }, { offset: Number.NEGATIVE_INFINITY, item: null }).item;
                }

                containers.forEach((container) => {
                    container.addEventListener('dragstart', (event) => {
                        const item = event.target.closest('[data-content-id]');
                        if (!item || isSaving) return;

                        draggedItem = item;
                        originalOrder = order(container);
                        item.classList.add('is-dragging');
                        event.dataTransfer.effectAllowed = 'move';
                    });

                    container.addEventListener('dragover', (event) => {
                        if (!draggedItem || draggedItem.parentElement !== container) return;

                        event.preventDefault();
                        const nextItem = itemAfterPointer(container, event.clientY);
                        container.insertBefore(draggedItem, nextItem);
                    });

                    container.addEventListener('dragend', () => {
                        if (!draggedItem) return;

                        draggedItem.classList.remove('is-dragging');
                        const changed = JSON.stringify(originalOrder) !== JSON.stringify(order(container));
                        const changedContainer = container;
                        draggedItem = null;

                        if (changed) void persistOrder(changedContainer);
                    });

                    container.addEventListener('click', (event) => {
                        const button = event.target.closest('.move-content');
                        if (!button || isSaving) return;

                        const item = button.closest('[data-content-id]');
                        const sibling = button.dataset.direction === 'up'
                            ? item.previousElementSibling
                            : item.nextElementSibling;

                        if (!sibling?.matches('[data-content-id]')) return;

                        originalOrder = order(container);
                        if (button.dataset.direction === 'up') {
                            container.insertBefore(item, sibling);
                        } else {
                            container.insertBefore(sibling, item);
                        }

                        void persistOrder(container);
                    });
                });
            });
        </script>
    @endif
@endsection
