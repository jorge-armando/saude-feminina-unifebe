@extends('layouts.app')

@section('title', 'Novo Conteúdo')

@section('content')

    <link rel="stylesheet" href="https://uicdn.toast.com/editor/latest/toastui-editor.min.css">

    <div class="create-page">

        <div class="create-header">
            <div class="header-left">
                <a href="{{ route('painel') }}" class="btn-back">
                    <img src="{{ asset('images/voltar.png') }}" alt="Voltar">
                </a>

                <div>
                    <h1>Novo Conteúdo</h1>
                    <p>Preencha os campos abaixo</p>
                </div>
            </div>
        </div>

        <div class="create-content">

            <form action="" method="POST" class="create-form">
                @csrf

                <div class="form-card">

                    <h2>Informações Básicas</h2>

                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" name="title" placeholder="Ex: Entendendo o Ciclo Menstrual" required>
                    </div>

                    <div class="form-group">
                        <label>Tempo de Leitura</label>
                        <input type="number" name="reading_time" placeholder="Ex: 5" required>
                    </div>

                    <div class="form-group">
                        <label>Tags</label>
                        <input type="text" name="tags" placeholder="ciclo, saúde, bem-estar">

                        <small>Separe as tags com vírgula</small>
                    </div>

                </div>

                <div class="form-card">

                    <h2>Conteúdo</h2>

                    <div class="form-group">
                        <label></label>

                        <div id="editor"></div>

                        <input type="hidden" name="content" id="content">
                    </div>

                </div>

                <div class="form-actions">
                    <a href="{{ route('painel') }}" class="btn-cancel">Cancelar</a>

                    <button type="submit" class="btn-save">
                        Criar Conteúdo
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

                    height: '250px',

                    initialEditType: 'wysiwyg',

                    previewStyle: 'vertical',

                    placeholder: 'Escreva seu conteúdo aqui...',

                    hideModeSwitch: false,

                    toolbarItems: [
                        ['heading', 'bold', 'italic'],
                        ['ul', 'ol'],
                        ['link', 'quote']
                    ]

                });

                const form = document.querySelector('.create-form');

                form.addEventListener('submit', function () {

                    document.querySelector('#content').value =
                        editor.getMarkdown();

                });

            }

        });
    </script>
@endsection