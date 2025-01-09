# IMDb Clone Website

## Overview
This project is a web-based application designed to mimic IMDb functionalities. It allows users to register, log in, search for movies, view detailed information about movies, and save their favorite movies. It is built using modern web development technologies and showcases an understanding of full-stack web development principles.

## Features
1. **Main Page**:
   - Displays a welcome message with placeholder student IDs.
   - Provides options to "Register" or "Login".

2. **User Registration**:
   - Allows new users to create an account by providing their name, email, and password.
   - Ensures passwords are confirmed before submission.

3. **User Login**:
   - Allows registered users to log in using their email and password.
   - Redirects users to the movie search page upon successful authentication.

4. **Movie Search**:
   - Users can search for movies by entering a query.
   - Pagination support to display a specified number of movies per page.
   - Displays movie posters, titles, release years, and a "View Details" button for each movie.

5. **Movie Details**:
   - Displays detailed information about the selected movie, including:
     - Title
     - Release Date
     - Genre
     - Director
     - Cast
     - Plot Summary
     - IMDb Rating
     - Trailer
   - Allows users to add the movie to their favorites.

6. **Favorites**:
   - Lists all movies added to the user's favorites.
   - Provides an option to remove movies from the favorites list.

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: JSON file (users.json to store users data)
- **API**: OMDB API

## Installation and Setup
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/jalaafarhat/IMDB-clone-website.git
   ```

2. **Navigate to the Project Directory**:
   ```bash
   cd IMDB-clone-website
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     PORT=3000
     DB_URI=your_database_uri
     API_KEY=your_omdb_api_key
     ```

5. **Run the Server**:
   ```bash
   npm start
   ```
   - The application will be accessible at `http://localhost:3000`.

## How to Use
1. Open the application in a web browser.
2. Register as a new user or log in with existing credentials.
3. Use the search bar to find movies.
4. Click on "View Details" to see more information about a movie.
5. Add movies to your favorites list and view them in the "Favorites" section.


## Screenshots
1. **Main Page**:
  ![Screenshot (322)](https://github.com/user-attachments/assets/c4a39173-e3f5-490b-ac00-8d7f015ff036)

2. **Registration Page**:
   ![Screenshot (323)](https://github.com/user-attachments/assets/6f889cd7-21b8-4752-864e-e5c02585e862)

3. **Login Page**:
   ![Screenshot (324)](https://github.com/user-attachments/assets/5f9314ed-331a-4590-bdf7-273c0a52b6b9)

4. **Movie Search Page**:
  ![Screenshot (325)](https://github.com/user-attachments/assets/1bd6af2c-eede-458e-a381-489e95be1425)
   
5. **Movie Details Page**:
   ![Screenshot (326)](https://github.com/user-attachments/assets/ecc078d1-36dd-4a79-b2e9-6e39dd2de7fe)

6. **Add to Favorites Modal**:
   ![Screenshot (327)](https://github.com/user-attachments/assets/5ddfe771-4117-4f27-a7a1-23a152bed692)

7. **Favorites Page**:
   ![Screenshot (329)](https://github.com/user-attachments/assets/5258f228-4f03-471c-a291-252e7aa564e2)

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Author
[Jalaa Farhat](https://github.com/jalaafarhat)

