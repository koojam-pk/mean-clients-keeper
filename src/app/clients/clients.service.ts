import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';

import { catchError } from 'rxjs/operators';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

import { Client} from './../models/client';

@Injectable()
export class ClientsService {
  private url = 'http://localhost:3000/api/clients';

  constructor(private http: HttpClient) { }

  getClients(filter = '', sortField = 'first_name', sortOrder = 'asc', pageNumber = 0, pageSize = 3) {
    return this.http.get<Client []>(this.url, {
      params: new HttpParams()
        .set('filter', filter)
        .set('sortField', sortField)
        .set('sortOrder', sortOrder)
        .set('pageNumber', pageNumber.toString())
        .set('pageSize', pageSize.toString())
    });
  }

  getFilteredClientsLength(filter = '') {
    return this.http.get<number>(this.url + '-all', {
      params: new HttpParams()
        .set('filter', filter)
      })
      .pipe(
        catchError(this.handleError)
      );
  }

  addClient(clientData) {
    return this.http.post<Client>(this.url, clientData)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateClient(clientData) {
    return this.http.put<Client>(this.url + '/' + clientData.id, clientData)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteClient(clientId) {
    return this.http.delete(this.url + '/' + clientId)
    .pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an ErrorObservable with a user-facing error message
    return new ErrorObservable(
      'Something bad happened; please try again later.');
  }
}
