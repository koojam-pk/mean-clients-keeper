import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { FormControl, Validators, FormGroup, FormBuilder } from '@angular/forms';

import { ClientsService } from './clients.service';

import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/of';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { catchError, finalize, tap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { merge } from 'rxjs/observable/merge';

import { Client } from './../models/client';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit, AfterViewInit {

  displayedColumns = ['first_name', 'last_name', 'email', 'phone', 'action'];
  dataSource: ClientsDataSource | null;
  emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  clientFormControl: FormGroup;
  isEdit = false;
  isAdd = false;
  editId = null;
  clientsCount = 0;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  constructor(private clientsService: ClientsService, private fb: FormBuilder) { }

  ngOnInit() {
    this.clientFormControl = this.fb.group({
      first_name: new FormControl('', [Validators.required]),
      last_name: new FormControl('', [Validators.required]),
      email: new FormControl(null, [Validators.required, Validators.pattern(this.emailPattern)]),
      phone: new FormControl(null, [Validators.required])
    });
    this.dataSource = new ClientsDataSource(this.clientsService);
    this.loadClientPage();
  }

  ngAfterViewInit() {
    // server-side search
    fromEvent(this.filter.nativeElement, 'keyup')
    .pipe(
        debounceTime(150),
        distinctUntilChanged(),
        tap(() => {
            this.paginator.pageIndex = 0;
            this.loadClientPage();
        })
    )
    .subscribe();

    // reset the paginator after sorting
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    // on sort or paginate events, load a new page
    merge(this.sort.sortChange, this.paginator.page)
    .pipe(
        tap(() => this.loadClientPage())
    )
    .subscribe();
  }

  loadClientPage() {
    this.dataSource.loadClients(
      this.filter.nativeElement.value,
      this.sort.active,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize);
    this.clientsService.getFilteredClientsLength(this.filter.nativeElement.value)
      .subscribe(
        (data => {
          this.clientsCount = data.length;
        })
      );
  }

  // Edit Client, load form
  onEdit(client) {
    this.isEdit = true;
    this.isAdd = false;
    this.editId = client._id;
    this.clientFormControl.setValue({last_name: client.last_name,
                                      first_name: client.first_name,
                                      email: client.email,
                                      phone: client.phone});
  }

  // Delete Client
  onDelete(id) {
    this.clientsService.deleteClient(id)
      .subscribe(
        () => {
          this.loadClientPage();
        }
      );
  }

  onEditCancel() {
    this.isAdd = false;
    this.isEdit = false;
    this.editId = null;
    this.clientFormControl.reset();
  }

  onAddCancel() {
    this.isAdd = false;
    this.isEdit = false;
    this.clientFormControl.reset();
  }

  onSaveClient() {
    const last_name = this.clientFormControl.value.last_name;
    const first_name = this.clientFormControl.value.first_name;
    const email = this.clientFormControl.value.email;
    const phone = this.clientFormControl.value.phone;

    this.clientsService.addClient({
      first_name,
      last_name,
      email,
      phone
    }).subscribe(
      client => {
        this.isAdd = false;
        this.isEdit = false;
        this.clientFormControl.reset();
        this.loadClientPage();
      }
    );
  }

  onUpdateClient() {
    const last_name = this.clientFormControl.value.last_name;
    const first_name = this.clientFormControl.value.first_name;
    const email = this.clientFormControl.value.email;
    const phone = this.clientFormControl.value.phone;

    this.clientsService.updateClient({
      first_name,
      last_name,
      email,
      phone,
      id: this.editId
    }).subscribe(
      client => {
        this.isAdd = false;
        this.isEdit = false;
        this.editId = null;
        this.clientFormControl.reset();
        this.loadClientPage();
      }
    );
  }

  onAddClient() {
    this.isAdd = true;
    this.isEdit = false;
  }
  getEmailErrorMsg() {
    return this.clientFormControl.get('email').errors.required ? 'Your email is required' :
      this.clientFormControl.get('email').errors.pattern ? 'Your email not valid' : '';
  }
}

// https://blog.angular-university.io/angular-material-data-table/
export class ClientsDataSource extends DataSource<any> {
  private clientsData$ = new BehaviorSubject<Client []>([]);
  private loadingData$ = new BehaviorSubject<boolean>(false);

  private loading$ = this.loadingData$.asObservable();

  constructor(private clientsService: ClientsService) {
    super();
  }
  // connect(): Observable<Client[]> {
  connect(collectionViewer: CollectionViewer): Observable<Client []> {
    return this.clientsData$.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer) {
    this.clientsData$.complete();
    this.loadingData$.complete();
  }

  loadClients(filter = '', sortField = 'first_name', sortDirection = 'asc', pageIndex = 0, pageSize = 3) {
    this.loadingData$.next(true);
    this.clientsService.getClients(filter, sortField, sortDirection, pageIndex, pageSize)
      .pipe(
        catchError(() => Observable.of([])),
        finalize(() => this.loadingData$.next(false))
      )
      .subscribe(clients => this.clientsData$.next(clients));
  }
}

/*
var recursiveSearch = (query) => {
  var regExp = new RegExp(query);
  var results = [];
  db.clients.find().forEach((items) => {
    var recursiveFunc = (itemsArray, itemKey) => {
      var itemValue = itemsArray[itemKey];
      if (regExp.test(itemValue)) {
        results.push(items);
      }
      if(typeof itemValue === "object") {
        Object.keys(itemValue).forEach((itemValueKey) => {
          recursiveFunc(itemValue, itemValueKey);
        });
      }
    };
    Object.keys(items).forEach((item) => {
      recursiveFunc(items, item);
    });
  });
  var setTemp = new Set();
  // filter off duplicate document
  printjson(results.filter((item) => {
    var key = item._id, isNew = !setTemp.has(key);
    if (isNew) setTemp.add(key);
    return isNew;
  }));
};

*/
