class Repository {
  constructor() {
  }
  public init() { }

  public commit() { }
  private getEditScript() { }
  private applyEditScript() { }
  public checkout() { }
  private generateCommitId() { }

  public switchBranch() { }
  public createBranch() { }
  public removeBranch() { }

  // edit tree
  public createTree() { }
  public removeTree() { }
  public createBlob() { }
  public removeBlob() { }

  public log() { } // this may not needed because of visualized version control system
}