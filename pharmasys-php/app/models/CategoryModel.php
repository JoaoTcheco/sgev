<?php
class CategoryModel {
    public static function all(): array {
        return Database::all('SELECT * FROM categories ORDER BY name');
    }
    public static function find(string $id): ?array {
        return Database::one('SELECT * FROM categories WHERE id = ?', [$id]);
    }
    public static function create(array $d): string {
        $id = uuidv4();
        Database::query('INSERT INTO categories (id, name, description) VALUES (?,?,?)',
            [$id, $d['name'], $d['description'] ?? null]);
        return $id;
    }
    public static function update(string $id, array $d): void {
        Database::query('UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [$d['name'], $d['description'] ?? null, $id]);
    }
    public static function delete(string $id): void {
        Database::query('DELETE FROM categories WHERE id = ?', [$id]);
    }
}
