const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

// snake case to camel case

const conversionOfSnakeCaseToCamelCase = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
    directorName: dbObject.director_name,
  };
};

//API 1 Returns a list of all movie names in the movie table

app.get("/movies/", async (request, response) => {
  const getMoviesListQuery = `
    SELECT 
    DISTINCT movie_name
    FROM
    movie;`;
  const movieNamesList = await db.all(getMoviesListQuery);
  response.send(
    movieNamesList.map((eachMovie) =>
      conversionOfSnakeCaseToCamelCase(eachMovie)
    )
  );
});

//API2 Creates a new movie in the movie table. movie_id is auto-incremented

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addNewMovieQuery = `
    INSERT INTO
        movie(director_id , movie_name, lead_actor)
    VALUES(
        '${directorId}',
        '${movieName}',
        '${leadActor}'
    );`;
  const newMovie = await db.run(addNewMovieQuery);
  response.send("Movie Successfully Added");
});

//API3 Returns a movie based on the movie ID

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetailsQuery = `
    SELECT 
    *
    FROM 
        movie
    WHERE movie_id = ${movieId};`;
  const movieDetails = await db.get(getMovieDetailsQuery);
  response.send(conversionOfSnakeCaseToCamelCase(movieDetails));
});

//API 4 Updates the details of a movie in the movie table based on the movie ID

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieDetailsQuery = `
    UPDATE 
        movie
    SET 
        director_id= '${directorId}',
        movie_name= '${movieName}',
        lead_actor= '${leadActor}'
    WHERE movie_id = ${movieId};`;
  const dbResponse = await db.run(updateMovieDetailsQuery);
  response.send("Movie Details Updated");
});

//API 5 Deletes a movie from the movie table based on the movie ID

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM
        movie
    WHERE movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//API 6 Returns a list of all directors in the director table

app.get("/directors/", async (request, response) => {
  const getDirectorsDetailsQuery = `
    SELECT
    *
    FROM
        director;`;
  const directorsList = await db.all(getDirectorsDetailsQuery);
  response.send(
    directorsList.map((eachDirector) =>
      conversionOfSnakeCaseToCamelCase(eachDirector)
    )
  );
});

//API 7 Returns a list of all movie names directed by a specific director

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getListOfMoviesByDirectorIdQuery = `
    SELECT 
        movie.movie_name
    FROM 
        movie
    INNER JOIN 
        director
    ON movie.director_id = director.director_id
    WHERE director.director_id = ${directorId};`;
  const moviesList = await db.all(getListOfMoviesByDirectorIdQuery);
  response.send(
    moviesList.map((eachItem) => conversionOfSnakeCaseToCamelCase(eachItem))
  );
});

module.exports = app;
