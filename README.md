# Movie Link Platform

## Key Features

### Secure User Authentication:

- Password encryption using bcrypt
- Session-based authentication
- Registration with email validation
- Login error handling

### Movie Database Integration:

- Search movies by title
- View detailed movie information
- Save favorite movies

### Link Management System:

- Users can submit streaming links for movies
- Public/private link visibility controls
- User-specific link management page
- Link reviews and ratings system

### Admin Dashboard:

- Special admin login: **admin@gmail.com / Admin123**
- View all public links sorted by popularity
- Delete inappropriate links
- Monitor user activity

### Enhanced Security:

- Session management with express-session
- Protected admin routes
- Client-side input validation
- Secure password storage

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** bcrypt, express-session
- **APIs:** OMDB API
- **Styling:** Bootstrap 5
- **Notifications:** SweetAlert2

## Installation & Setup

### Prerequisites:

- Node.js (v14+)
- MongoDB Atlas account or local MongoDB installation
- OMDB API key

### Configuration:

```bash
# Clone the repository
git clone https://github.com/jalaafarhat/IMDB-clone-website.git
cd IMDB-clone-website
npm install
```

### Environment Setup:

Create `.env` file with:

```env
PORT=3000
MONGO_URI=mongodb_connection_string
API_KEY=omdb_api_key
SESSION_SECRET=session_secret
```

### Database Setup:

```bash
# Create admin user (first run only)
node createAdmin.js
```

### Running:

```bash
npm start
```

Access at: [http://localhost:3000](http://localhost:3000)

## Usage Guide

### User Accounts:

- Register with valid email and password (min 6 chars, at least one capital letter)
- Login to access personalized features

### Movie Features:

- Search movies using title keywords
- Save favorites for quick access
- Submit streaming links for movies

### Link Management:

- Set links as public/private
- View personal link statistics
- Rate and review public links

### Admin Access:

- Login with **admin@gmail.com / Admin123**
- Monitor and manage public links
- Remove inappropriate content

## Security Features

- Password hashing with bcrypt (10 rounds)
- Session cookie hardening:

```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}
```

- CSRF protection for form submissions
- Rate limiting on authentication endpoints
- Input sanitization for all user-generated content

## Screenshots

### Admin Dashboard:

![Admin Dashboard](Admin_Dashboard.png)

### Link Management:

![Link Management](Link_Management.png)

### User Profile:

![User Profile](User_Profile.png)

### Public Links Browser:

![Public Links](Public_Links.png)

## License

MIT License - See LICENSE for details

## Developer

**Jalaa Farhat**  
[GitHub Profile](https://github.com/jalaafarhat)  
[Project Repository](https://github.com/jalaafarhat/IMDB-clone-website)
