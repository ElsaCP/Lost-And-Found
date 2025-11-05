# app.py
from flask import Flask
from routes.route import main  # import blueprint dari file route.py
from routes.admin_route import admin_bp  # tambahkan ini

app = Flask(__name__)

# Daftarkan blueprint
app.register_blueprint(main)
app.register_blueprint(admin_bp)  # daftarkan blueprint admin

if __name__ == "__main__":
    app.run(debug=True)