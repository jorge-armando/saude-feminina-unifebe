@extends('layouts.app')

@section('title', 'Login')

@section('content')

    <div class="login-page">
        <div class="login-card">
            <h1>Admin</h1>
            <p>Minha Saúde Feminina</p>

            <form>
                <div class="form-group">
                    <label for="email">Email</label>

                    <div class="input-wrapper">
                        <img src="{{ asset('images/email.png') }}" alt="Logo"> <input type="email" id="email"
                            placeholder="admin@example.com">
                    </div>
                </div>

                <div class="form-group">
                    <label for="password">Senha</label>

                    <div class="input-wrapper">
                        <img src="{{ asset('images/senha.png') }}" alt="Logo">
                        <input type="password" id="password" placeholder="••••••••">
                    </div>
                </div>

                <button type="submit">Entrar</button>
            </form>
        </div>
    </div>

@endsection