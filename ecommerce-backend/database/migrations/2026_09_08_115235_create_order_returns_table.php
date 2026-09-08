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
        Schema::create('order_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['return', 'refund', 'exchange']);
            $table->enum('reason', [
                'damaged_product',
                'wrong_item',
                'not_as_described',
                'size_issue',
                'changed_mind',
                'other'
            ]);
            $table->text('description')->nullable();
            $table->json('images')->nullable(); // proof er chobi
            $table->integer('quantity'); // koyta item return korche
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'picked_up', 'refunded'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_returns');
    }
};
