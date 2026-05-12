@extends('layouts.app')

@section('title', 'Login')

@section('content')

    <div class="login-page">
        <div class="login-card">
            <h1>Admin</h1>
            <p>Minha Saúde Feminina</p>

            <form method="POST" action="{{ route('login.autenticar') }}">
                @csrf

                <div class="form-group">
                    <label for="email">Email</label>

                    <div class="input-wrapper">
                        <img src="{{ asset('images/email.png') }}" alt="Email">
                        <input type="email" id="email" name="email" placeholder="admin@example.com"
                            value="{{ old('email') }}">
                    </div>
                </div>

                <div class="form-group">
                    <label for="password">Senha</label>

                    <div class="input-wrapper">
                        <img src="{{ asset('images/senha.png') }}" alt="Senha">
                        <input type="password" id="password" name="password" placeholder="••••••••">
                    </div>
                </div>

                @error('email')
                    <p class="erro-login">{{ $message }}</p>
                @enderror

                <button type="submit">Entrar</button>
            </form>
        </div>
    </div>

@endsection