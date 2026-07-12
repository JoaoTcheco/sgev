<?php
class SettingController extends Controller {
    public function index(): void {
        requireRole('admin');
        $this->render('settings/index', ['s' => SettingModel::get()]);
    }
    public function save(): void {
        requireRole('admin'); csrfVerify();

        $before = SettingModel::get();
        SettingModel::update($_POST);
        $after  = SettingModel::get();

        // Calcula diff campo a campo (só regista o que mudou).
        $ignore = ['id','created_at','updated_at'];
        $diff = [];
        foreach ($after as $k => $v) {
            if (in_array($k, $ignore, true)) continue;
            $b = $before[$k] ?? null;
            if ((string)$b !== (string)$v) {
                $diff[$k] = ['before' => $b, 'after' => $v];
            }
        }
        if ($diff) {
            try {
                AuditLogModel::log('settings.update', 'pharmacy_settings', '1', [
                    'changed_fields' => array_keys($diff),
                    'diff'           => $diff,
                ]);
            } catch (Throwable $e) { /* silencioso — nunca bloqueia gravar config */ }
        }

        flash('success', $diff
            ? sprintf('Configurações actualizadas (%d campo(s) alterado(s)).', count($diff))
            : 'Configurações gravadas (sem alterações).');
        redirect('settings');
    }
}
