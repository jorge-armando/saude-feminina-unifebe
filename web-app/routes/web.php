<?php

use Illuminate\Support\Facades\Route;

Route::get('/login', function () {
    return view('auth.login');
});

Route::get('/painel', function () {
    return view('dashboard');
});

Route::get('/novo-conteudo', function () {
    return view('create');
});