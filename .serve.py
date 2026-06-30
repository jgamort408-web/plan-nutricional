from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys
class Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def end_headers(self):
        # Desarrollo: nunca cachear, para que cada F5 cargue lo último
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    def log_message(self, *a): pass
class Server(ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True
port = int(sys.argv[1]) if len(sys.argv)>1 else 8000
Server(('127.0.0.1', port), Handler).serve_forever()
