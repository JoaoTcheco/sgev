<?php
class SettingController extends Controller {
    public function index(): void {
        requireRole('admin');
        $this->view('settings/index', ['s' => SettingModel::get()]);
    }
    public function save(): void {
        requireRole('admin'); csrfVerify();
        SettingModel::update($_POST);
        flash('success', 'Configurações actualizadas.');
        redirect('settings');
    }
}
