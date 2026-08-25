@extends('layouts.app')

@section('title', isset($content) ? 'Editar Conteúdo' : 'Novo Conteúdo')

@section('content')

    <link rel="stylesheet" href="https://uicdn.toast.com/editor/latest/toastui-editor.min.css">

    <div class="create-page">

        <div class="create-header">
            <div class="header-left">
                <a href="{{ route('painel') }}" class="btn-back">
                    <img src="{{ asset('images/voltar.png') }}" alt="Voltar">
                </a>

                <div>
                    <h1>{{ isset($content) ? 'Editar Conteúdo' : 'Novo Conteúdo' }}</h1>
                    <p>{{ isset($content) ? 'Altere os campos abaixo' : 'Preencha os campos abaixo' }}</p>
                </div>
            </div>
        </div>

        <div class="create-content">

            <form action="{{ isset($content) ? route('contents.update', $content) : route('conteudos.store') }}"
                method="POST" class="create-form">
                @csrf

                @if(isset($content))
                    @method('PUT')
                @endif

                @if ($errors->any())
                    <div class="alert alert-error" role="alert">
                        <strong>Não foi possível salvar o conteúdo.</strong>
                        <ul>
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <div class="form-card">

                    <h2>Informações Básicas</h2>

                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" name="title" placeholder="Ex: Entendendo o Ciclo Menstrual"
                            value="{{ old('title', $content->title ?? '') }}" required>
                    </div>

                    <div class="form-group">
                        <label>Tempo de Leitura</label>
                        <input type="number" name="reading_time" placeholder="Ex: 5"
                            value="{{ old('reading_time', $content->reading_time ?? '') }}" required>
                    </div>

                    <div class="form-group">
                        <label>Tags</label>
                        <input type="text" name="tags" placeholder="ciclo, saúde, bem-estar"
                            value="{{ old('tags', $content->tags ?? '') }}">

                        <small>Separe as tags com vírgula</small>
                    </div>

                    <div class="form-group">
                        <label for="youtube_url">Vídeo do YouTube (opcional)</label>
                        <input id="youtube_url" type="url" name="youtube_url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value="{{ old('youtube_url', $content->youtube_url ?? '') }}">

                        <small>Cole um link do YouTube, YouTube Shorts ou youtu.be. O app abrirá o vídeo e poderá exibir o miniplayer.</small>
                    </div>

                </div>

                <div class="form-card">

                    <h2>Conteúdo</h2>

                    <div class="form-group">
                        <div id="editor"></div>

                        <input type="hidden" name="content" id="content"
                            value="{{ old('content', $content->content ?? '') }}">

                        <small>Para usar uma imagem no artigo e no card em destaque, insira-a pelo botão de imagem do editor. A primeira imagem será usada como capa.</small>
                    </div>

                </div>

                <div class="form-actions">
                    <a href="{{ route('painel') }}" class="btn-cancel">Cancelar</a>

                    <button type="submit" class="btn-save">
                        {{ isset($content) ? 'Salvar Alterações' : 'Criar Conteúdo' }}
                    </button>
                </div>

            </form>

        </div>

    </div>

    <script src="https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js"></script>

    <script>
        document.addEventListener('DOMContentLoaded', function () {

            const editorElement = document.querySelector('#editor');

            if (editorElement) {

                const editor = new toastui.Editor({

                    el: editorElement,

                    height: '600px',

                    initialEditType: 'wysiwyg',

                    previewStyle: 'vertical',

                    placeholder: 'Escreva seu conteúdo aqui...',

                    initialValue: @json(old('content', $content->content ?? '')),

                    hideModeSwitch: false,

                    toolbarItems: [
                        ['heading', 'bold', 'italic', 'strike'],
                        ['hr', 'quote'],
                        ['ul', 'ol', 'task', 'indent', 'outdent'],
                        ['table', 'image', 'link'],
                        ['code', 'codeblock'],
                        ['scrollSync']
                    ],

                    hooks: {
                        addImageBlobHook(blob, callback) {

                            const formData = new FormData();
                            formData.append('image', blob);

                            fetch('{{ route("conteudos.upload-imagem") }}', {
                                method: 'POST',
                                headers: {
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                                    'Accept': 'application/json',
                                },
                                body: formData,
                            })
                                .then(async (response) => {
                                    const data = await response.json();

                                    if (!response.ok || !data.url) {
                                        throw new Error(data.message || 'Falha no envio da imagem.');
                                    }

                                    return data;
                                })
                                .then((data) => callback(data.url, blob.name || 'imagem'))
                                .catch(() => alert('Não foi possível enviar a imagem.'));

                        }
                    }

                });
                setTimeout(function () {
                    window.scrollTo(0, 0);
                }, 100);

                const form = document.querySelector('.create-form');

                form.addEventListener('submit', function () {

                    document.querySelector('#content').value = editor.getMarkdown();

                });

            }

        });
    </script>

@endsection
