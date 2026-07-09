<?php
/**
 * Controller base — render de views + JSON.
 */
class Controller {
    protected function view(string $view, array $data = [], string $layout = 'app'): void {
        extract($data);
        $viewFile   = APP_PATH . '/views/' . $view . '.php';
        $layoutFile = APP_PATH . '/views/layouts/' . $layout . '.php';
        if (!file_exists($viewFile)) {
            http_response_code(500);
            die("View não encontrada: {$view}");
        }
        ob_start();
        require $viewFile;
        $content = ob_get_clean();
        if (file_exists($layoutFile)) {
            require $layoutFile;
        } else {
            echo $content;
        }
    }

    protected function json($data, int $code = 200): void {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
