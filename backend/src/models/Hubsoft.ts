/* eslint-disable no-restricted-syntax */
import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  AllowNull
} from "sequelize-typescript";


@Table({
  tableName: 'Hubsoft' // Substitua 'nome_da_tabela' pelo nome correto da tabela
})
class Hubsoft extends Model<Hubsoft> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  client_id: number;

  @Column
  host: string;

  @Column
  client_secret: string;

  @Column
  username: string;

  @Column
  password: string;

  @Column
  grant_type: string;

  @Column
  access_token: string;

  @Column
  refresh_token: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Hubsoft;
