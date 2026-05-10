import { EntitySchema } from "typeorm";

const Control = new EntitySchema({
  name: "Control",
  tableName: "controles",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    estado: {
      type: "enum",
      enum: ["disponible", "dañado"],
      default: "disponible",
    },
    consolaId: {
      type: "int",
      nullable: true,
    },
  },
  relations: {
    consola: {
      type: "many-to-one",
      target: "Consola",
      inverseSide: "controles",
      joinColumn: { name: "consolaId" },
      onDelete: "SET NULL",
    },
  },
});

export default Control;