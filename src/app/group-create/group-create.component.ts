import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { GroupService } from '../group.service';
import { IonicModule, ActionSheetController, ToastController } from '@ionic/angular';
import { AuthService, users } from '../services/auth.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-group-create',
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.css']
})
export class GroupCreateComponent implements OnInit {
  groupName: string = '';
  selectedUserIds: string[] = [];
  allUsers: users[] = []; // assuming your "users" type contains { uid, email, displayName } or similar
  availableusers: users[] = [];

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private auth: Auth,
    private cdr: ChangeDetectorRef,

  ) {}

  async ngOnInit() {
    // Fetch all users
      this.authService.getUsers().subscribe({
        next: users => {
          this.availableusers = users;
          this.cdr.detectChanges();
        },
        error: () => {
          console.log('Erreur lors du chargement des utilisateurs', 'danger');
        }
      });
  }

  /*async createGroup() {
    const adminId = this.auth.currentUser?.uid;
    if (!adminId || !this.groupName || this.selectedUserIds.length === 0) {
      alert('Please provide a group name and select at least one user.');
      return;
    }

    try {
      // Create group with admin
      const groupId = await this.groupService.createGroup(this.groupName, adminId);

      // Add selected users
      for (const userId of this.selectedUserIds) {
        await this.groupService.inviteUser(groupId, userId);
      }

      alert('Group created successfully!');
      this.groupName = '';
      this.selectedUserIds = [];
    } catch (error) {
      console.error(error);
      alert('Error creating group.');
    }
  }*/
}
