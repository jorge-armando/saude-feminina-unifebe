<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContentController;


Route::get('/', function () {
    if (auth()->check()) {
        return redirect('/painel');
    }

    return redirect('/login');
});

Route::middleware('guest')->group(function () {

    Route::get('/login', [AuthController::class, 'login'])
        ->name('login');

    Route::post('/login', [AuthController::class, 'autenticar'])
        ->name('login.autenticar');

});

Route::middleware('auth')->group(function () {

    Route::get('/painel', [ContentController::class, 'index'])
    ->name('painel');

    Route::get('/novo-conteudo', function () {
        return view('create');
    });

Route::delete('/contents/{content}', [ContentController::class, 'destroy'])
    ->name('contents.destroy');


    Route::post('/sair', [AuthController::class, 'sair'])
        ->name('sair');

});

Route::fallback(function () {
    return redirect('/');
});