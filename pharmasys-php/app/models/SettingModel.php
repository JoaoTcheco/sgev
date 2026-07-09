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
            'UPDATE pharmacy_settings SET
              name=?, slogan=?, nuit=?, address=?, city=?, phone=?, email=?, website=?,
              receipt_width=?, receipt_header=?, receipt_footer=?, show_pharmacist=?, pharmacist_name=?,
              receipt_show_barcode=?, receipt_show_qr=?,
              label_layout=?, label_margin=?, label_width_mm=?, label_height_mm=?, label_columns=?,
              printer_name=?
             WHERE id = 1',
            [$d['name'] ?: 'PharmaSys', $d['slogan'] ?: null, $d['nuit'] ?: null,
             $d['address'] ?: null, $d['city'] ?: null, $d['phone'] ?: null,
             $d['email'] ?: null, $d['website'] ?: null,
             $d['receipt_width'] ?: '80mm',
             $d['receipt_header'] ?: null, $d['receipt_footer'] ?: null,
             isset($d['show_pharmacist']) ? 1 : 0,
             $d['pharmacist_name'] ?: null,
             isset($d['receipt_show_barcode']) ? 1 : 0,
             isset($d['receipt_show_qr']) ? 1 : 0,
             $d['label_layout'] ?: 'a4',
             max(0, (int)($d['label_margin'] ?? 4)),
             max(20, (int)($d['label_width_mm'] ?? 40)),
             max(10, (int)($d['label_height_mm'] ?? 25)),
             max(1, (int)($d['label_columns'] ?? 5)),
             $d['printer_name'] ?: null,
            ]);
    }
}
