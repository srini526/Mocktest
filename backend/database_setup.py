from api import app, initialize_database


if __name__ == "__main__":
    with app.app_context():
        initialize_database()
    print("Database tables and exam answer keys are ready.")
