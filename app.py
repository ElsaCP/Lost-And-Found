# app.py
from flask import Flask
from routes.route import main  # import blueprint dari file route.py

app = Flask(__name__)

# Daftarkan blueprint
app.register_blueprint(main)

if __name__ == "__main__":
    app.run(debug=True)