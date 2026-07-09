<?php
class AlertController extends Controller {
    public function index(): void {
        requireAuth();
        $this->render('alerts/index', ['items' => AlertModel::open()]);
    }
    public function refresh(): void {
        requireAuth(); csrfVerify();
        $r = AlertModel::refresh();
        flash('success', sprintf('Alertas recalculados: %d stock baixo, %d a expirar, %d expirados.',
            $r['low_stock'], $r['expiring'], $r['expired']));
        redirect('alerts');
    }
    public function resolve(): void {
        requireAuth(); csrfVerify();
        AlertModel::resolve($_POST['id']);
        flash('success', 'Alerta resolvido.');
        redirect('alerts');
    }
}
