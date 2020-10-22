export interface IdProps {
  [ propName: string ]: any
}

export interface Method {
  method: string
  props?: string[]
}

export class Change {
  entity?: string
  idProps: IdProps = {}
  methods: Method[] = []

  constructor()
  constructor(entityName: string)
  constructor(entityName: string, id: number)
  constructor(entityName: string, id: number, method: string)
  constructor(entityName: string, id: number, method: Method)
  constructor(entityName: string, id: number, methods: ( string | Method)[])
  constructor(entityName: string, idProps: IdProps)
  constructor(entityName: string, idProps: IdProps, method: string)
  constructor(entityName: string, idProps: IdProps, method: Method)
  constructor(entityName: string, idProps: IdProps, methods: ( string | Method)[])
  constructor(object: object)
  constructor(object: object)
  constructor(object: object, method: string)
  constructor(object: object, method: Method)
  constructor(object: object, methods: ( string | Method)[])
  constructor(classFunction: { new(): any })
  constructor(classFunction: { new(): any }, id: number)
  constructor(classFunction: { new(): any }, id: number, method: string)
  constructor(classFunction: { new(): any }, id: number, method: Method)
  constructor(classFunction: { new(): any }, id: number, methods: ( string | Method)[])
  constructor(classFunction: { new(): any }, idProps: IdProps)
  constructor(classFunction: { new(): any }, idProps: IdProps, method: string)
  constructor(classFunction: { new(): any }, idProps: IdProps, method: Method)
  constructor(classFunction: { new(): any }, idProps: IdProps, methods: ( string | Method)[])

  constructor(
      entity?: string | object | { new(): any },
      idPropsOrMethods?: number | IdProps | string | Method | ( string | Method)[],
      methods?: string | Method | ( string | Method)[]) {

    let firstParameterObject = false
    if (typeof entity === 'string') {
      this.entity = entity
    }
    else if (typeof entity === 'object' && entity !== null) {
      firstParameterObject = true
      this.entity = entity.constructor.name

      if ((<any> entity).id != undefined) {
        this.idProps = {
          id: (<any> entity).id
        }
      }
    }
    // class function
    else if (typeof entity === 'function' && (<any> entity).name != undefined) {
      this.entity = (<any> entity).name
    }

    if (firstParameterObject) {
    // if the first parameter was an object it was used to extract the entity name and its id
    // that means that the next parameter is supposed to be changes
      methods = idPropsOrMethods as any
    }
    else {
      if (typeof idPropsOrMethods === 'number') {
        // if the change is a number it is expected that it is the id of an entity
        this.idProps = {
          id: idPropsOrMethods
        }
      }
      else if (typeof idPropsOrMethods === 'object' && idPropsOrMethods !== null && ! (idPropsOrMethods instanceof Array)) {
        if (idPropsOrMethods.method == undefined) {
          this.idProps = idPropsOrMethods
        }
      }  
    }

    if (methods != undefined) {
      if (! (this.methods instanceof Array)) {
        this.methods = []
      }

      if (typeof methods === 'string') {
        this.methods.push({ method: methods })
      }
      else if (methods instanceof Array) {
        for (let change of methods) {
          if (typeof change === 'string') {
            this.methods.push({ method: change })
          }
          else if (typeof change === 'object' && change !== null) {
            if (change.method != undefined) {
              this.methods.push(change)
            }
          }
        }
      }  
      else if (typeof methods === 'object' && methods !== null) {
        if (methods.method != undefined) {
          this.methods.push(methods)
        }
      }
    }
  }

  isRelevantFor(changes: Change|Change[]): boolean {
    if (changes instanceof Change) {
      changes = [ changes ]
    }

    // if there are changes attached make a list out of the most specific
    // change. this means that the change methods matches.
    // if there are not any matches consider every change.
    if (this.methods != undefined && this.methods.length > 0) {
      let mostSpecificChanges = []

      for (let change of changes) {
        if (change.entity == this.entity && change.containsChangeMethod(this)) {
          mostSpecificChanges.push(change)
        }
      }

      if (mostSpecificChanges.length > 0) {
        changes = mostSpecificChanges
      }
    }

    for (let change of changes) {
      // if the entity name is not relevant just skip it
      if (! this.isEntityRelevant(change)) {
        continue
      }

      if (! this.isIdPropsRelevant(change)) {
        continue
      }

      if (this.isChangesRelevant(change)) {
        return true
      }
    }

    return false
  }

  private isEntityRelevant(change: Change): boolean {
    // if the entity names are not equal just skip it
    if (change.entity != this.entity) {
      return false
    }

    return true
  }

  private isIdPropsRelevant(change: Change): boolean {
    // if one of the idProps is undefined or null then it wants to be relevant for with anything
    if (this.idProps == undefined || change.idProps == undefined) {
      return true
    }

    // if the idProps have a different type than object then there is something wrong
    if (typeof this.idProps !== 'object' || typeof change.idProps !== 'object') {
      return false
    }

    // if one of the idProps does not contain any key then it wants to be relevant for with anything
    if (Object.keys(this.idProps).length == 0 || Object.keys(change.idProps).length == 0) {
      return true
    }

    for (let prop in change.idProps) {
      if (Object.prototype.hasOwnProperty.call(change.idProps, prop)) {
        // if the property on the given idProps is not present in this change
        // we think it is not relevant. for example if the parentId is missing on this
        // change then it cannot be relevant for the given change expecting
        // the parentId to be something specific.
        if (! (prop in this.idProps)) {
          return false
        }
        
        if (change.idProps[prop] !== this.idProps[prop]) {
          return false
        }
      }
    }

    return true
  }

  isChangesRelevant(change: Change): boolean {
    // if one of the changes is undefined or null then it wants it is relevant
    // because it was kept unspecific so that it is relevant in any way
    if (this.methods == undefined || change.methods == undefined) {
      return true
    }

    // if the changes have a different type than object then there is something wrong
    if (! (this.methods instanceof Array) || ! (change.methods instanceof Array)) {
      return false
    }

    // if one of the changes does not contain any element then it wants to be relevant for with anything
    if (this.methods.length == 0 ||change.methods.length == 0) {
      return true
    }

    for (let method of change.methods) {
      for (let thisChange of this.methods) {
        if (method.method == undefined || thisChange.method == undefined) {
          continue
        }

        if (method.method === thisChange.method) {
          if (method.props == undefined || thisChange.props == undefined) {
            return true
          }

          if (! (method.props instanceof Array) || ! (thisChange.props instanceof Array)) {
            return false
          }

          if (method.props.length == 0 || thisChange.props.length == 0) {
            return true
          }

          for (let prop of method.props) {
            for (let thisProp of thisChange.props) {
              // if any changed prop is equal it is relevant
              if (prop === thisProp) {
                return true
              }
            }
          }
        }
      }
    }

    // if there was not equal prop it is not relevant
    return false
  }

  private containsChangeMethod(change: Change): boolean {
    if (change.methods instanceof Array && this.methods instanceof Array) {
      for (let method of change.methods) {
        for (let thisChange of this.methods) {
          if (method.method != undefined && method.method === thisChange.method) {
            return true
          }
        }
      }
    }

    return false
  }

  static fromObject(object: any, method?: string, props?: string[]): Change|undefined {
    if (typeof object !== 'object' || object === null) {
      return
    }

    let change = new Change()
    change.entity = object.constructor.name
    change.idProps = this.guessIds(object)
    
    if (method != undefined) {
      let chg: Method = {
        method: method
      }

      if (props != undefined && props.length > 0) {
        chg.props = props
      }

      change.methods.push(chg)
    }

    return change
  }

  static guessIds(object: any): {[propName: string]: any} {
    if (typeof object !== 'object' || object === null) {
      return {}
    }

    let description: any = {}
    
    for (let prop in object) {
      if (Object.prototype.hasOwnProperty.call(object, prop)) {
        if (prop == 'id' || prop.length > 2 && prop.lastIndexOf('Id') == prop.length - 2) {
          description[prop] = object[prop]
        }
      }
    }

    return description
  }
}