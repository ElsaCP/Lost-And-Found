# app.py
from flask import Flask
from routes.route import main
from routes.admin_route import admin_bp

app = Flask(__name__)
app.secret_key = 'rahasia_elsa'  # penting untuk session

# Daftarkan blueprint
app.register_blueprint(main)
app.register_blueprint(admin_bp, url_prefix='/admin')  # tambahkan prefix

if __name__ == "__main__":
    app.run(debug=True)