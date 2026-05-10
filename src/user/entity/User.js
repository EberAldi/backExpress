// User.js
import { EntitySchema } from "typeorm";

const User = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
    },
    email: {
      type: "varchar",
      unique: true,
    },
    password: {
      type: "varchar",
      nullable: true,    
    },
    googleId: {
      type: "varchar",
      nullable: true,    
      unique: true,
    },
    avatar: {
      type: "varchar",
      nullable: true,    
    },
  },
});

export default User;