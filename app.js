const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let dbConnectionObject = null;

const initializeDBAndServer = async () => {
  try {
    dbConnectionObject = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1 scenarios:
const scenario1 = (requestObjectQuery) => {
  //console.log(requestObjectQuery.priority === "undefined"); //false
  console.log("scenario1");
  /*
  When the line console.log(requestObjectQuery.search_q); is executed
  inside scenario1, it logs undefined because the requestObjectQuery
  object that was passed into the function still does not have a property
  named search_q, and the default value assignment during object destructuring
  does not affect the object itself.
  */
  console.log(
    "Understanding Default Value Assignment in Object Destructuring in JavaScript in secnario 1:"
  );
  console.log(requestObjectQuery); //{ status: 'TO DO' } for GET http://localhost:3001/todos/?status=TO%20DO
  console.log(requestObjectQuery.search_q);
  return (
    requestObjectQuery.status !== undefined &&
    requestObjectQuery.priority === undefined
  );
};

const scenario2 = (requestObjectQuery) => {
  console.log("scenario2");
  console.log(requestObjectQuery.search_q);
  return (
    requestObjectQuery.status === undefined &&
    requestObjectQuery.priority !== undefined
  );
};
const scenario3 = (requestObjectQuery) => {
  console.log("scenario3");
  console.log(requestObjectQuery.search_q);
  return (
    requestObjectQuery.priority !== undefined &&
    requestObjectQuery.status !== undefined
  );
};
app.get("/todos/", async (requestObject, responseObject) => {
  let queryTodo = "";
  let dbResponse = null;
  const requestObjectQuery = requestObject.query;
  const { search_q = "", priority, status } = requestObjectQuery;
  console.log(
    "Understanding Default Value Assignment in Object Destructuring in JavaScript:"
  );
  console.log(requestObjectQuery); //{ status: 'TO DO' } for GET http://localhost:3001/todos/?status=TO%20DO
  /*
    When the line console.log(requestObjectQuery.search_q); is executed
  inside scenario1, it logs undefined because the requestObjectQuery
  object that was passed into the function still does not have a property
  named search_q, and the default value assignment during object destructuring
  does not affect the object itself.
  */

  switch (true) {
    case scenario1(requestObjectQuery):
      //console.log(typeof priority); //undefined
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status='${status}';`;
      console.log("1st query");
      break;

    case scenario2(requestObjectQuery):
      /*
      //console.log(typeof status); //"undefined"
        The typeof operator in JavaScript is used to determine the data type
      of a given value. When applied to the primitive value undefined, 
      it returns the string "undefined". This is because undefined is indeed 
      a primitive type in JavaScript and represents the absence of a meaningful value.
      */

      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority='${priority}';`;
      console.log("2nd query");
      break;
    case scenario3(requestObjectQuery):
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority='${priority}' AND status='${status}';`;
      console.log("3rd query");
      break;
    default:
      queryTodo = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
      console.log("4th query");
      break;
  }

  dbResponse = await dbConnectionObject.all(queryTodo);
  responseObject.send(dbResponse);
});

//API 2:
app.get("/todos/:todoId/", async (requestObject, responseObject) => {
  const todoIdObject = requestObject.params;

  const { todoId } = todoIdObject;
  //const requestBody = requestObject.body;
  //console.log(requestBody);//{}
  const todoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const dbResponse = await dbConnectionObject.get(todoQuery);
  //console.log(dbResponse);
  const { id, todo, priority, status } = dbResponse;
  const dbResponseResult = {
    id: id,
    todo: todo,
    priority: priority,
    status: status,
  };
  responseObject.send(dbResponseResult);
});

//API 3:
app.post("/todos/", async (requestObject, responseObject) => {
  const requestBody = requestObject.body;
  /*
  {
  "id": 10,
  "todo": "Finalize event theme",
  "priority": "LOW",
  "status": "TO DO"
  }
  */

  /*
  console.log(requestBody);
  output for requestBody:
  {
  id: 10,
  todo: 'Finalize event theme',
  priority: 'LOW',
  status: 'TO DO'
}
  */

  const { id, todo, priority, status } = requestBody;
  const todoQuery = `
  INSERT INTO todo(id, todo, priority, status )
  VALUES(${id},'${todo}','${priority}','${status}');
  `;
  await dbConnectionObject.run(todoQuery);
  responseObject.send("Todo Successfully Added");
});

//API 4 scenarios:
const statusScenario1 = (requestBody) => {
  return requestBody.hasOwnProperty("status");
};
const priorityScenario2 = (requestBody) => {
  return requestBody.hasOwnProperty("priority");
};
app.put("/todos/:todoId/", async (requestObject, responseObject) => {
  let dbResponse = null;
  let sendingText = "";
  let todoQuery = "";
  const todoIdObject = requestObject.params;
  const { todoId } = todoIdObject;
  const requestBody = requestObject.body;
  const { status, priority, todo } = requestBody;
  switch (true) {
    case statusScenario1(requestBody):
      console.log("1st query");
      sendingText = "Status Updated";
      todoQuery = `UPDATE todo SET status='${status}' WHERE id=${todoId};`;
      break;
    case priorityScenario2(requestBody):
      console.log("2nd query");
      sendingText = "Priority Updated";
      todoQuery = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`;
      break;
    default:
      console.log("3rd query");
      sendingText = "Todo Updated";
      todoQuery = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`;
      break;
  }
  dbResponse = await dbConnectionObject.run(todoQuery);
  responseObject.send(sendingText);
});

//API 5:
app.delete("/todos/:todoId/", async (requestObject, responseObject) => {
  const todoIdObject = requestObject.params;

  const { todoId } = todoIdObject;
  const todoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await dbConnectionObject.run(todoQuery);
  responseObject.send("Todo Deleted");
});
module.exports = app;
