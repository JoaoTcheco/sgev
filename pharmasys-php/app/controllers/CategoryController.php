<?php
class CategoryController extends Controller {
    public function index(): void {
        requireAuth();
        $editing = null;
        if (!empty($_GET['edit'])) $editing = CategoryModel::find($_GET['edit']);
        $this->render('categories/index', [
            'items'   => CategoryModel::all(),
            'editing' => $editing,
        ]);
    }
    public function save(): void {
        requireAuth(); csrfVerify();
        $data = ['name' => trim($_POST['name'] ?? ''), 'description' => trim($_POST['description'] ?? '')];
        if ($data['name'] === '') { flash('error', 'Nome obrigatório.'); redirect('categories'); }
        try {
            if (!empty($_POST['id'])) { CategoryModel::update($_POST['id'], $data); flash('success', 'Categoria actualizada.'); }
            else { CategoryModel::create($data); flash('success', 'Categoria criada.'); }
        } catch (PDOException $e) {
            flash('error', 'Erro: ' . $e->getMessage());
        }
        redirect('categories');
    }
    public function delete(): void {
        requireAuth(); csrfVerify();
        try { CategoryModel::delete($_POST['id']); flash('success', 'Categoria removida.'); }
        catch (PDOException $e) { flash('error', 'Não é possível remover — em uso por produtos.'); }
        redirect('categories');
    }
}
