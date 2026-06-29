from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys
class Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def log_message(self, *a): pass
class Server(ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True
port = int(sys.argv[1]) if len(sys.argv)>1 else 8000
Server(('127.0.0.1', port), Handler).serve_forever()
