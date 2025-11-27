# app.py
from flask import Flask
from config import Config
from extensions import db
from routes.route import main
from routes.admin_route import admin_bp

app = Flask(__name__)
app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

# Membuat tabel jika belum ada
with app.app_context():
    db.create_all()  # Membuat semua tabel berdasarkan model
    
# Daftarkan blueprint
app.register_blueprint(main)
app.register_blueprint(admin_bp, url_prefix='/admin')  # tambahkan prefix

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
    
