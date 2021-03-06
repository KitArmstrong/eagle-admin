import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Compliance } from 'app/models/compliance';
import { Project } from 'app/models/project';
import { ApiService } from 'app/services/api';
import { StorageService } from 'app/services/storage.service';
import { MatSnackBar } from '@angular/material';
import { TableObject } from 'app/shared/components/table-template/table-object';
import { TableParamsObject } from 'app/shared/components/table-template/table-params-object';
import { AssetTableRowsComponent } from './asset-table-rows/asset-table-rows.component';

@Component({
  selector: 'app-submission-detail-detail',
  templateUrl: './submission-detail.component.html',
  styleUrls: ['./submission-detail.component.scss']
})
export class SubmissionDetailComponent implements OnInit, OnDestroy {
  private ngUnsubscribe: Subject<boolean> = new Subject<boolean>();
  public compliance: Compliance = null;
  public submission: any = null;
  public assets = [];
  public currentProject: Project = null;
  public publishText: string;
  public loading = true;
  public tableParams: TableParamsObject = new TableParamsObject();
  public tableData: TableObject;
  public tableColumns: any[] = [
    {
      name: 'Assets',
      value: 'internalExt',
      width: 'col-2',
      nosort: true
    },
    {
      name: 'Caption',
      value: 'caption',
      width: 'col-4',
      nosort: true
    },
    {
      name: 'UTM Coordinates',
      value: 'geo',
      width: 'col-3',
      nosort: true
    },
    {
      name: 'Actions',
      value: 'actions',
      width: 'col-3',
      nosort: true
    }
  ];
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: ApiService,
    private _changeDetectionRef: ChangeDetectorRef,
    private storageService: StorageService,
    private snackBar: MatSnackBar,
  ) {
  }

  ngOnInit() {
    this.currentProject = this.storageService.state.currentProject.data;

    this.route.data
      .takeUntil(this.ngUnsubscribe)
      .subscribe((res: any) => {
        this.compliance = new Compliance(res.compliance.data);
        this.submission = res.submission.data;
        this.submission.description = this.submission.description.replace(new RegExp('\n', 'g'), '<br />');

        this.assets = this.submission.items;
        // This is to make sure we are using the browsers timezone.
        for (let i = 0; i < this.assets.length; i++) {
          this.assets[i].timestamp = new Date(this.assets[i].timestamp);
        }

        this.tableParams.totalListItems = this.assets.length;
        this.tableParams.currentPage = 1;
        this.tableParams.pageSize = 100000;
        this.setRowData();
        this.loading = false;
        this._changeDetectionRef.detectChanges();

        let self = this;

        self.assets.map(async z => {
          if (z.type === 'photo') {
            // Show thumb
            let resource = await self.api.downloadElementThumbnail(self.compliance._id, self.submission._id, z._id);
            const reader = new FileReader();
            reader.readAsDataURL(resource);
            reader.onloadend = function () {
              // result includes identifier 'data:image/png;base64,' plus the base64 data
              z.src = reader.result;
              self._changeDetectionRef.detectChanges();
            };
          } else if (z.type === 'video') {
            // Show it's type with a clickable event.
          } else if (z.type === 'voice') {
            // Show it's type with a clickable event.
          } else if (z.type === 'text') {
            // Show it's type with a clickable event.
          }
        });
      });

  }

  setRowData() {
    if (this.assets && this.assets.length > 0) {
      this.tableData = new TableObject(
        AssetTableRowsComponent,
        this.assets,
        this.tableParams,
        {
          inspection: this.compliance,
          elementId: this.submission._id
        }
      );
    }
  }

  public openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 2000,
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
