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
    auth0Id: {
      type: "varchar",
      nullable: true,
      unique: true,
    },
    rol: {
  type: "enum",
  enum: ["admin", "gerente", "empleado", "cajero"],
  default: "empleado"
},
    avatar: {
      type: "varchar",
      nullable: true,    
    },
    permisos: { type: "jsonb", nullable: true },
    activo: { type: "boolean", default: true },
    eliminadoEn: { type: "timestamp", nullable: true },
    pushSubscription: { type: "text", nullable: true }
  },
});

export default User;