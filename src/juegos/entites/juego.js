import { EntitySchema } from "typeorm";

const Juego = new EntitySchema({
  name: "Juego",
  tableName: "juegos",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    nombre: {
      type: "varchar",
    },
    genero: {
      type: "enum",
      enum: ["accion", "deportes", "peleas", "carreras", "aventura", "terror", "multijugador", "otro"],
      default: "otro",
    },
    plataforma: {
      type: "varchar",   // "PS4", "PS5", "Xbox One", "Nintendo Switch"...
    },
    portada: {
      type: "varchar",
      nullable: true,    // URL de imagen
    },
    disponible: {
      type: "boolean",
      default: true,     // para desactivar sin borrar
    },
  },
  relations: {
    consolas: {
    type: "many-to-many",
    target: "Consola",
    inverseSide: "juegos",

    joinTable: {
      name: "consola_juegos",

      joinColumn: {
        name: "juegoId",
      },

      inverseJoinColumn: {
        name: "consolaId",
      },
    },
  },
  },
});

export default Juego;