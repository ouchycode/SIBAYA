<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('logbooks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->string('student_email');
            $table->string('supervisor_email');
            $table->date('date');
            $table->text('summary')->nullable();
            $table->text('revisions')->nullable();
            $table->text('next_steps')->nullable();
            $table->integer('progress_percentage')->nullable();
            $table->boolean('validated_by_supervisor')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logbooks');
    }
};
