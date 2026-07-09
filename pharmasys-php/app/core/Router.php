<?php
/**
 * Router — mapa simples "rota" => "Controller@action".
 * As rotas vêm de index.php como $_GET['r'] (ex: 'sales/refund/abc-123').
 */
class Router {
    private array $routes = [];

    public function add(string $path, string $handler, string $method = 'GET', bool $auth = false, array $roles = []): void {
        $this->routes[strtoupper($method) . ' ' . trim($path, '/')] = [
            'handler' => $handler,
            'auth'    => $auth,
            'roles'   => $roles,
        ];
    }

    public function dispatch(string $uri): void {
        $uri = trim(parse_url($uri, PHP_URL_PATH) ?? '', '/');
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        // Tenta rota exacta
        $key = $method . ' ' . $uri;
        $route = $this->routes[$key] ?? null;

        // Tenta rota com parâmetros (ex: "sales/refund/abc" ↔ "sales/refund")
        $params = [];
        if (!$route) {
            $parts = explode('/', $uri);
            while (count($parts) > 0) {
                array_unshift($params, array_pop($parts));
                $try = $method . ' ' . implode('/', $parts);
                if (isset($this->routes[$try])) {
                    $route = $this->routes[$try];
                    break;
                }
            }
        }

        if (!$route) {
            http_response_code(404);
            $route = $this->routes['GET error/notfound'] ?? null;
            $params = [];
        }

        if ($route['auth']) requireAuth();

        [$class, $action] = explode('@', $route['handler']);
        if (!class_exists($class) || !method_exists($class, $action)) {
            http_response_code(500);
            die("Rota inválida: {$route['handler']}");
        }
        $ctrl = new $class();
        call_user_func_array([$ctrl, $action], $params);
    }
}
