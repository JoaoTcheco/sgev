<?php
class SettingModel {
    public static function get(): array {
        $s = Database::one('SELECT * FROM pharmacy_settings WHERE id = 1');
        if (!$s) {
            Database::query('INSERT INTO pharmacy_settings (id, name) VALUES (1, "PharmaSys")');
            $s = Database::one('SELECT * FROM pharmacy_settings WHERE id = 1');
        }
        return $s;
    }
    public static function update(array $d): void {
        Database::query(
            'UPDATE pharmacy_settings SET name=?, slogan=?, nuit=?, address=?, city=?, phone=?, email=?,
             website=?, receipt_width=?, receipt_header=?, receipt_footer=?, show_pharmacist=?
             WHERE id = 1',
            [$d['name'] ?: 'PharmaSys', $d['slogan'] ?: null, $d['nuit'] ?: null,
             $d['address'] ?: null, $d['city'] ?: null, $d['phone'] ?: null,
             $d['email'] ?: null, $d['website'] ?: null,
             $d['receipt_width'] ?: '80mm',
             $d['receipt_header'] ?: null, $d['receipt_footer'] ?: null,
             isset($d['show_pharmacist']) ? 1 : 0]);
    }
}
