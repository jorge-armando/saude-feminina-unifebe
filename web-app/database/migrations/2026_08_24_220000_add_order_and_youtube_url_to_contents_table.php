<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contents', function (Blueprint $table): void {
            $table->unsignedInteger('position')->nullable()->index();
            $table->string('youtube_url', 2048)->nullable();
        });

        $contents = DB::table('contents')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['id']);

        foreach ($contents as $index => $content) {
            DB::table('contents')
                ->where('id', $content->id)
                ->update(['position' => $index + 1]);
        }
    }

    public function down(): void
    {
        Schema::table('contents', function (Blueprint $table): void {
            $table->dropIndex(['position']);
            $table->dropColumn(['position', 'youtube_url']);
        });
    }
};
